-- Adicionar coluna justification à tabela travel_requests
ALTER TABLE "travel_requests" ADD COLUMN "justification" text;

-- Adicionar coluna cost_center à tabela travel_requests se não existir
ALTER TABLE "travel_requests" ADD COLUMN "cost_center" text;

-- Adicionar coluna parent_request_id à tabela travel_requests se não existir
ALTER TABLE "travel_requests" ADD COLUMN "parent_request_id" uuid;

-- Adicionar constraint para parent_request_id
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_parent_request_id_fk" FOREIGN KEY ("parent_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE no action ON UPDATE no action;
