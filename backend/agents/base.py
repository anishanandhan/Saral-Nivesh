"""
Base Agent — Abstract base class for all agents in the pipeline.
Every agent has: a name, audit logging, error handling with fallbacks,
and structured input/output.
"""

import time
import uuid
from typing import Any, Optional
from audit.logger import get_audit_logger
from agents.model_router import get_router


class BaseAgent:
    """
    Base class for all Opportunity Radar agents.
    
    Provides:
    - Automatic audit logging on every action
    - Graceful error handling with fallback responses
    - Model routing via the shared ModelRouter
    - Session tracking for pipeline runs
    """

    AGENT_NAME = "BaseAgent"

    def __init__(self):
        self.logger = get_audit_logger()
        self.router = get_router()

    def run(self, state: dict, session_id: str = "") -> dict:
        """
        Execute this agent's work. Subclasses override `execute()`.
        This wrapper handles logging, timing, and error recovery.
        """
        if not session_id:
            session_id = state.get("session_id", str(uuid.uuid4())[:8])

        start = time.time()
        self.logger.log(
            agent_name=self.AGENT_NAME,
            action="start",
            input_summary=str(list(state.keys())),
            session_id=session_id,
        )

        try:
            result = self.execute(state, session_id)
            duration_ms = (time.time() - start) * 1000

            self.logger.log(
                agent_name=self.AGENT_NAME,
                action="complete",
                output_summary=str(list(result.keys())) if isinstance(result, dict) else "done",
                duration_ms=duration_ms,
                status="success",
                session_id=session_id,
            )

            # Merge result into state
            if isinstance(result, dict):
                state.update(result)
            state["last_agent"] = self.AGENT_NAME
            return state

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            self.logger.log(
                agent_name=self.AGENT_NAME,
                action="error",
                error_message=str(e),
                duration_ms=duration_ms,
                status="error",
                session_id=session_id,
            )

            # Graceful fallback — agent failure doesn't crash pipeline
            self.logger.log(
                agent_name=self.AGENT_NAME,
                action="fallback_activated",
                decision="Using cached/default data due to agent error",
                status="fallback",
                session_id=session_id,
            )
            fallback = self.fallback(state, session_id, str(e))
            if isinstance(fallback, dict):
                state.update(fallback)
            state["last_agent"] = f"{self.AGENT_NAME} (fallback)"
            return state

    def execute(self, state: dict, session_id: str) -> dict:
        """Override in subclass — main agent logic."""
        raise NotImplementedError

    def fallback(self, state: dict, session_id: str, error: str) -> dict:
        """Override in subclass — fallback when execute fails."""
        return {}

    def llm_call(
        self,
        task_type: str,
        prompt: str,
        system_prompt: str = "",
        session_id: str = "",
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """
        Make an LLM call via the model router.
        Automatically routes to fast or reasoning model based on task_type.
        """
        result = self.router.route(
            task_type=task_type,
            prompt=prompt,
            system_prompt=system_prompt,
            agent_name=self.AGENT_NAME,
            temperature=temperature,
            max_tokens=max_tokens,
            session_id=session_id,
        )
        return result.get("response", "")
