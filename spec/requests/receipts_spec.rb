require 'rails_helper'

RSpec.describe 'Receipts', type: :request do
  let(:user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  describe 'POST /receipts' do
    context 'with valid auth token' do
      it 'creates a receipt' do
        post '/receipts', params: { receipt: { image: 'test' } }.to_json, headers: headers
        expect(response).to have_http_status(:created)
      end
    end

    context 'without auth token' do
      it 'returns unauthorized' do
        post '/receipts', params: { receipt: { image: 'test' } }.to_json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
