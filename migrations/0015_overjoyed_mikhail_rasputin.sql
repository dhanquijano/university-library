CREATE INDEX "transaction_verifications_transaction_id_idx" ON "transaction_verifications" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_verifications_status_idx" ON "transaction_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_verifications_verified_at_idx" ON "transaction_verifications" USING btree ("verified_at");