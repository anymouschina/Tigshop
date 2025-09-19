-- CreateTable
CREATE TABLE "blacklisted_token" (
    id SERIAL NOT NULL,
    token TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklisted_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_token_token_key" ON "blacklisted_token"("token");

-- AddForeignKey
ALTER TABLE "blacklisted_token" ADD CONSTRAINT "blacklisted_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;