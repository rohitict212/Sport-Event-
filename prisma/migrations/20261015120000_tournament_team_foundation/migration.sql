CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournaments_id_organization_id_key" ON "tournaments"("id", "organization_id");
CREATE INDEX "tournaments_organization_id_created_at_idx" ON "tournaments"("organization_id", "created_at");
CREATE UNIQUE INDEX "teams_tournament_id_name_key" ON "teams"("tournament_id", "name");
CREATE INDEX "teams_organization_id_created_at_idx" ON "teams"("organization_id", "created_at");

ALTER TABLE "tournaments"
    ADD CONSTRAINT "tournaments_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams"
    ADD CONSTRAINT "teams_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams"
    ADD CONSTRAINT "teams_tournament_id_organization_id_fkey"
    FOREIGN KEY ("tournament_id", "organization_id")
    REFERENCES "tournaments"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
