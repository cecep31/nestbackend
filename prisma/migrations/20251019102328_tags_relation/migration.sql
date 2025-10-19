-- CreateTable
CREATE TABLE "post_bookmarks" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_post_bookmarks_created_at" ON "post_bookmarks"("created_at");

-- CreateIndex
CREATE INDEX "idx_post_bookmarks_deleted_at" ON "post_bookmarks"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_post_bookmarks_post_id" ON "post_bookmarks"("post_id");

-- CreateIndex
CREATE INDEX "idx_post_bookmarks_user_id" ON "post_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_bookmark_post_id_user_id" ON "post_bookmarks"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "posts_to_tags" ADD CONSTRAINT "posts_to_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "fk_post_bookmarks_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "fk_post_bookmarks_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
