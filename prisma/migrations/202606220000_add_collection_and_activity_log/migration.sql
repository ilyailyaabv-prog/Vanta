-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('performer', 'video', 'tag', 'collection', 'media', 'user');

-- CreateTable: Collection
CREATE TABLE "collection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "video_count" INTEGER NOT NULL DEFAULT 0,
    "performer_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CollectionVideo (junction)
CREATE TABLE "collection_video" (
    "collection_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_video_pkey" PRIMARY KEY ("collection_id", "video_id")
);

-- CreateTable: CollectionModel (junction)
CREATE TABLE "collection_model" (
    "collection_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_model_pkey" PRIMARY KEY ("collection_id", "model_id")
);

-- CreateTable: ActivityLog
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" "ActivityEntityType" NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes: Collection
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");
CREATE INDEX "idx_collection_published_sort" ON "collection"("is_published", "sort_order");
CREATE INDEX "idx_collection_featured" ON "collection"("is_featured");
CREATE INDEX "idx_collection_slug" ON "collection"("slug");

-- CreateIndexes: CollectionVideo
CREATE INDEX "idx_collection_video_video_id" ON "collection_video"("video_id");
CREATE INDEX "idx_collection_video_sort" ON "collection_video"("collection_id", "sort_order");

-- CreateIndexes: CollectionModel
CREATE INDEX "idx_collection_model_model_id" ON "collection_model"("model_id");

-- CreateIndexes: ActivityLog
CREATE INDEX "idx_activity_log_created_at" ON "activity_log"("created_at" DESC);
CREATE INDEX "idx_activity_log_entity" ON "activity_log"("entity_type", "entity_id");
CREATE INDEX "idx_activity_log_user_id" ON "activity_log"("user_id");

-- AddForeignKey: CollectionVideo -> Collection
ALTER TABLE "collection_video" ADD CONSTRAINT "collection_video_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE;

-- AddForeignKey: CollectionVideo -> Video
ALTER TABLE "collection_video" ADD CONSTRAINT "collection_video_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE RESTRICT;

-- AddForeignKey: CollectionModel -> Collection
ALTER TABLE "collection_model" ADD CONSTRAINT "collection_model_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE;

-- AddForeignKey: CollectionModel -> Model
ALTER TABLE "collection_model" ADD CONSTRAINT "collection_model_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE RESTRICT;

-- AddForeignKey: ActivityLog -> User
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;