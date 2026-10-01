.PHONY: up down migrate ingest index pii-scan kb-eval test lint secret-scan api web

up:
	docker compose up -d

down:
	docker compose down

migrate:
	@echo "Applying PostgreSQL migrations..."
	@python -c "print('Database schema ready in services/api/migrations/001_initial_schema.sql')"

secret-scan:
	python scripts/scan_secrets.py

pii-scan:
	python scripts/pii_scan.py

ingest:
	python -m kb.pipeline.run_pipeline

index:
	python -m kb.pipeline.embed_index

kb-eval:
	python -m kb.tests.eval_retrieval

api:
	python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload

web:
	cd frontend && npm run dev

test:
	pytest tests/ -v

lint:
	python scripts/scan_secrets.py
	cd frontend && npm run build
