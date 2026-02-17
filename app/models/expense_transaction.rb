class ExpenseTransaction < ApplicationRecord
  belongs_to :user
  has_one :receipt, dependent: :destroy
  belongs_to :category, optional: true
  has_one_attached :receipt_image

  validates :amount, presence: true
  validates :amount, numericality: { other_than: 0, message: "cannot be zero" }
  validates :direction, inclusion: { in: %w[debit credit], message: "%{value} is not a valid direction" }
  validates :currency, inclusion: { in: %w[ETB USD EUR GBP], allow_nil: true }, if: -> { currency.present? }
  validates :confidence_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1, allow_nil: true }, if: -> { confidence_score.present? }

  def receipt_url
    return nil unless receipt_image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(receipt_image, only_path: true)
  end
end

