-- PARLEY System Database Schema (Extended)
-- Version 1.1 — Adds CRM leads, callbacks, and escalations table
-- Run this AFTER 001_initial_schema.sql

-- 15. CRM Leads
CREATE TABLE IF NOT EXISTS crm_leads (
    lead_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    market VARCHAR(16) NOT NULL,
    disposition VARCHAR(32) NOT NULL DEFAULT 'interested',
    slots JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_session ON crm_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_market ON crm_leads(market);

-- 16. CRM Callbacks
CREATE TABLE IF NOT EXISTS crm_callbacks (
    callback_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    preferred_time TEXT,
    market VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. CRM Escalations
CREATE TABLE IF NOT EXISTS crm_escalations (
    escalation_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64),
    reason TEXT NOT NULL,
    market VARCHAR(16) NOT NULL,
    customer_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. KB Version entry for v1.1 (bootstrap)
INSERT INTO kb_versions (kb_version, parent_version, notes, status)
VALUES ('v1.1', 'v1.0', 'Production KB with embed-v4.0 Cohere embeddings', 'active')
ON CONFLICT (kb_version) DO NOTHING;
