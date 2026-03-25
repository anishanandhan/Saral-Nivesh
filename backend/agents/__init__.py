"""
Multi-Agent System for Opportunity Radar.
5 specialized agents orchestrated via a pipeline.
"""
from .base import BaseAgent
from .data_harvester import DataHarvesterAgent
from .signal_detector import SignalDetectorAgent
from .context_enricher import ContextEnricherAgent
from .alert_composer import AlertComposerAgent
from .portfolio_personaliser import PortfolioPersonaliserAgent
from .orchestrator import run_pipeline
from .model_router import ModelRouter
