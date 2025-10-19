-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "text" TEXT,
    "post_id" UUID,
    "parrent_comment_id" BIGINT,
    "created_by" UUID,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "title" VARCHAR(255),
    "created_by" UUID,
    "body" TEXT,
    "slug" VARCHAR(255),
    "photo_url" TEXT,
    "published" BOOLEAN DEFAULT true,
    "view_count" BIGINT DEFAULT 0,
    "like_count" BIGINT DEFAULT 0,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "first_name" VARCHAR(255) DEFAULT 'pilput',
    "last_name" VARCHAR(255) DEFAULT 'admin',
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "image" TEXT,
    "is_super_admin" BOOLEAN DEFAULT false,
    "username" VARCHAR(255),
    "github_id" BIGINT,
    "followers_count" BIGINT DEFAULT 0,
    "following_count" BIGINT DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts_to_tags" (
    "post_id" UUID NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "posts_to_tags_posts_id_tags_id_pk" PRIMARY KEY ("post_id","tag_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "name" VARCHAR(255),
    "path" TEXT,
    "size" INTEGER,
    "type" VARCHAR(255),
    "created_by" UUID,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "post_id" UUID,
    "user_id" UUID,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "bio" TEXT,
    "website" TEXT,
    "phone" VARCHAR(50),
    "location" VARCHAR(255),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "title" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(100),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_views" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "refresh_token" VARCHAR(200) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("refresh_token")
);

-- CreateIndex
CREATE INDEX "posts_deleted_at_idx" ON "posts"("deleted_at");

-- CreateIndex
CREATE INDEX "posts_created_by_idx" ON "posts"("created_by", "slug", "published", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "creator and slug inique" ON "posts"("created_by", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_username" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_unique" ON "users"("github_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_tags_name" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "idx_like_post_id_created_by" ON "likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_profiles_user_id" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_follows_follower_id" ON "user_follows"("follower_id");

-- CreateIndex
CREATE INDEX "idx_user_follows_following_id" ON "user_follows"("following_id");

-- CreateIndex
CREATE INDEX "idx_user_follows_created_at" ON "user_follows"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_follows_deleted_at" ON "user_follows"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_post_likes_created_at" ON "post_likes"("created_at");

-- CreateIndex
CREATE INDEX "idx_post_likes_deleted_at" ON "post_likes"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_post_likes_post_id" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "idx_post_likes_user_id" ON "post_likes"("user_id");

-- CreateIndex
CREATE INDEX "idx_post_views_created_at" ON "post_views"("created_at");

-- CreateIndex
CREATE INDEX "idx_post_views_deleted_at" ON "post_views"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_post_views_post_id" ON "post_views"("post_id");

-- CreateIndex
CREATE INDEX "idx_post_views_user_id" ON "post_views"("user_id");

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "fk_post_comments_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "fk_posts_post_comments" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts_to_tags" ADD CONSTRAINT "posts_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "fk_user_follows_follower_id" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "fk_user_follows_following_id" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "fk_post_likes_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "fk_post_likes_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "fk_post_views_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
