# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_17_091408) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "budgets", force: :cascade do |t|
    t.decimal "amount"
    t.bigint "category_id", null: false
    t.datetime "created_at", null: false
    t.string "month"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["category_id"], name: "index_budgets_on_category_id"
    t.index ["month"], name: "index_budgets_on_month"
    t.index ["user_id", "category_id", "month"], name: "index_budgets_on_user_category_month", unique: true
    t.index ["user_id"], name: "index_budgets_on_user_id"
  end

  create_table "categories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["name"], name: "index_categories_on_name"
    t.index ["user_id", "name"], name: "index_categories_on_user_and_name", unique: true
    t.index ["user_id"], name: "index_categories_on_user_id"
  end

  create_table "expense_transactions", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2
    t.bigint "category_id"
    t.float "confidence_score"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "direction"
    t.string "institution"
    t.string "invoice_no"
    t.string "merchant_name"
    t.datetime "occurred_at"
    t.string "payer_name"
    t.string "payment_channel"
    t.text "payment_reason"
    t.text "raw_text"
    t.string "source"
    t.string "status"
    t.string "system_category"
    t.string "transaction_type"
    t.datetime "updated_at", null: false
    t.string "user_category"
    t.bigint "user_id", null: false
    t.index ["category_id"], name: "index_expense_transactions_on_category_id"
    t.index ["created_at"], name: "index_expense_transactions_on_created_at"
    t.index ["invoice_no"], name: "index_expense_transactions_on_invoice_no"
    t.index ["occurred_at"], name: "index_expense_transactions_on_occurred_at"
    t.index ["status"], name: "index_expense_transactions_on_status"
    t.index ["user_id", "created_at"], name: "index_expense_transactions_on_user_and_created_at"
    t.index ["user_id"], name: "index_expense_transactions_on_user_id"
  end

  create_table "receipts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "expense_transaction_id", null: false
    t.string "image_url"
    t.string "ocr_provider"
    t.text "ocr_text"
    t.string "processing_status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["expense_transaction_id"], name: "index_receipts_on_expense_transaction_id"
    t.index ["processing_status"], name: "index_receipts_on_processing_status"
    t.index ["user_id"], name: "index_receipts_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "password_digest"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "budgets", "categories"
  add_foreign_key "budgets", "users"
  add_foreign_key "categories", "users"
  add_foreign_key "expense_transactions", "categories"
  add_foreign_key "expense_transactions", "users"
  add_foreign_key "receipts", "expense_transactions"
  add_foreign_key "receipts", "users"
end
