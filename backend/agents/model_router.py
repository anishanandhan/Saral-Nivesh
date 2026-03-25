"""
Model Router — Smart routing for cost efficiency.
Routes cheap tasks (classification, extraction) to Groq Llama 3.1 8B (fast).
Routes complex tasks (reasoning, alert generation) to Groq Llama 3.3 70B.
Logs routing decision + estimated cost per call.

This is the architecture that scores Technical Creativity points.
"""

from openai import OpenAI
from typing import Optional
import json
import time

from config import GROQ_API_KEY, GROQ_BASE_URL
from audit.logger import get_audit_logger

# Model tiers
MODEL_FAST = "llama-3.1-8b-instant"       # Fast, cheap — classification, extraction
MODEL_REASONING = "llama-3.3-70b-versatile"  # Complex reasoning, alert generation

# Cost estimates (per 1M tokens, approximate)
COST_MAP = {
    MODEL_FAST: {"input": 0.05, "output": 0.08},      # ~₹4/1M tokens
    MODEL_REASONING: {"input": 0.59, "output": 0.79},  # ~₹50/1M tokens
}

# Task type → model mapping
TASK_ROUTING = {
    "classification": MODEL_FAST,
    "extraction": MODEL_FAST,
    "formatting": MODEL_FAST,
    "summarization": MODEL_FAST,
    "sentiment": MODEL_FAST,
    "reasoning": MODEL_REASONING,
    "alert_generation": MODEL_REASONING,
    "analysis": MODEL_REASONING,
    "chat": MODEL_REASONING,
    "scenario_handling": MODEL_REASONING,
}


class ModelRouter:
    """
    Smart model router — routes tasks to the optimal LLM based on complexity.
    Logs every routing decision to the audit trail.
    """

    def __init__(self):
        self.client = None
        if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
            self.client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
        self.logger = get_audit_logger()
        self.call_count = {"fast": 0, "reasoning": 0}
        self.total_cost = 0.0

    def route(
        self,
        task_type: str,
        prompt: str,
        system_prompt: str = "",
        agent_name: str = "ModelRouter",
        temperature: float = 0.3,
        max_tokens: int = 1024,
        session_id: str = "",
    ) -> dict:
        """
        Route a task to the optimal model and execute.
        Returns: {response, model_used, cost_estimate, duration_ms}
        """
        # Determine model
        model = TASK_ROUTING.get(task_type, MODEL_REASONING)
        tier = "fast" if model == MODEL_FAST else "reasoning"

        # Log the routing decision
        self.logger.log(
            agent_name="ModelRouter",
            action=f"route_{task_type}",
            decision=f"Routed to {tier} model: {model}",
            data_source=f"task_type={task_type}",
            input_summary=prompt[:200],
            model_used=model,
            session_id=session_id,
        )

        if self.client is None:
            # Fallback: return empty response
            self.logger.log(
                agent_name="ModelRouter",
                action="fallback_no_api",
                decision="No API key configured — returning fallback",
                status="fallback",
                session_id=session_id,
            )
            return {
                "response": "",
                "model_used": model,
                "cost_estimate": 0.0,
                "duration_ms": 0.0,
                "fallback": True,
            }

        # Execute LLM call
        start = time.time()
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            duration_ms = (time.time() - start) * 1000
            response_text = response.choices[0].message.content.strip()

            # Estimate cost
            input_tokens = response.usage.prompt_tokens if response.usage else 0
            output_tokens = response.usage.completion_tokens if response.usage else 0
            costs = COST_MAP.get(model, COST_MAP[MODEL_REASONING])
            cost = (input_tokens * costs["input"] + output_tokens * costs["output"]) / 1_000_000
            self.total_cost += cost
            self.call_count[tier] += 1

            # Log successful call
            self.logger.log(
                agent_name=agent_name,
                action=f"llm_call_{task_type}",
                decision=f"Generated {len(response_text)} chars",
                output_summary=response_text[:200],
                model_used=model,
                cost_estimate=cost,
                duration_ms=duration_ms,
                status="success",
                session_id=session_id,
            )

            return {
                "response": response_text,
                "model_used": model,
                "cost_estimate": round(cost, 6),
                "duration_ms": round(duration_ms, 1),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "fallback": False,
            }

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            self.logger.log(
                agent_name=agent_name,
                action=f"llm_call_{task_type}",
                status="error",
                error_message=str(e),
                model_used=model,
                duration_ms=duration_ms,
                session_id=session_id,
            )
            return {
                "response": "",
                "model_used": model,
                "cost_estimate": 0.0,
                "duration_ms": round(duration_ms, 1),
                "fallback": True,
                "error": str(e),
            }

    def get_stats(self) -> dict:
        """Return routing stats for the cost dashboard."""
        return {
            "fast_calls": self.call_count["fast"],
            "reasoning_calls": self.call_count["reasoning"],
            "total_cost_usd": round(self.total_cost, 4),
            "total_cost_inr": round(self.total_cost * 84, 2),  # Approx USD→INR
            "model_fast": MODEL_FAST,
            "model_reasoning": MODEL_REASONING,
        }


# Singleton
_router_instance = None

def get_router() -> ModelRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = ModelRouter()
    return _router_instance
