# PARLEY Architecture

## System Diagram

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Browser Client (React/Vite)]
        UI[UI Components]
        VAD[Voice Activity Detection]
        WS[WebSocket Client]
        API_Client[REST Client]
    end

    %% Backend API Layer
    subgraph Backend [FastAPI Backend]
        Router[API Router]
        WS_Server[WebSocket Server]
    end

    %% Agent Core Layer
    subgraph Core [Agent Core]
        FSM[FSM Engine]
        SG[Sentence Gate]
        LR[Language Router & Drift Detector]
    end

    %% Voice Pipeline
    subgraph Voice [Voice Pipeline]
        Call_Provider[Call Provider Interface]
        ASR[ASR Adapters]
        TTS[TTS Adapters]
    end

    %% Knowledge & Insights
    subgraph Knowledge [Knowledge & Insights]
        RAG[Hybrid Retriever]
        BM25[BM25 Index]
        Vector[Vector DB]
        Insights[Live Insights Engine]
    end

    %% Connections
    UI <-->|HTTP/WS| Router
    WS <-->|WS| WS_Server
    
    Router --> FSM
    Router --> RAG
    WS_Server --> Insights
    
    FSM --> SG
    FSM --> LR
    
    Call_Provider --> ASR
    Call_Provider --> TTS
    
    FSM -.-> Call_Provider
    Insights -.-> WS_Server
```

## Key Components

1. **Frontend**: React/TypeScript using Vite. Integrates Web Speech API directly into the browser for live microphone streaming (ASR) and synthesis (TTS) to provide a zero-latency development loop.
2. **Backend**: FastAPI providing REST endpoints for FSM session control and a WebSocket endpoint for live streaming nudges.
3. **FSM Engine**: Manages dialogue state, enforces the required flow (Greeting -> Verification -> Purpose), and delegates unscripted queries to the RAG backend.
4. **Sentence Gate**: Ensures every single utterance that leaves the bot is verified against the KB (or strictly classified as social/disclosure).
5. **Insights Engine**: Analyzes transcripts in near real-time (sub-second) to push WebSockets events for compliance warnings and cross-sell opportunities to the supervisor cockpit.
6. **Language Router**: Assesses formality and language mix specifically to maintain proper register for native-language (Taglish, Indonesian) callers.
