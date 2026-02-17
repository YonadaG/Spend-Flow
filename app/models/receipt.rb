class Receipt < ApplicationRecord
  belongs_to :user
  belongs_to :expense_transaction, optional: true
  has_one_attached :image

  validates :processing_status, inclusion: {
    in: %w[pending processing processed failed],
    message: "%{value} is not a valid processing status"
  }
  validates :ocr_text, length: { maximum: 10000 }, allow_nil: true
  validates :image, presence: { message: "must be attached" }, on: :create

  after_initialize :set_default_status, if: :new_record?

  private

  def set_default_status
    self.processing_status ||= "pending"
  end
end
