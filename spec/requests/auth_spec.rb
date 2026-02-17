require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  let(:user) { create(:user) }
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:valid_credentials) do
    {
      email: user.email,
      password: user.password
    }.to_json
  end
  let(:invalid_credentials) do
    {
      email: Faker::Internet.email,
      password: Faker::Internet.password
    }.to_json
  end

  describe 'POST /signup' do
    let(:valid_attributes) do
      {
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      }.to_json
    end

    context 'when request is valid' do
      before { post '/signup', params: valid_attributes, headers: headers }

      it 'creates a new user' do
        expect(User.count).to eq(1)
      end

      it 'returns success status' do
        expect(response).to have_http_status(:created)
      end
    end

    context 'when request is invalid' do
      before { post '/signup', params: { email: '', password: 'foo' }.to_json, headers: headers }

      it 'returns failure status' do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /login' do
    context 'when request is valid' do
      before { post '/login', params: valid_credentials, headers: headers }

      it 'returns an authentication token' do
        expect(json['token']).not_to be_nil
      end

      it 'returns a success status' do
        expect(response).to have_http_status(:ok)
      end
    end

    context 'when request is invalid' do
      before { post '/login', params: invalid_credentials, headers: headers }

      it 'returns a failure message' do
        expect(json['error']).to match(/Invalid email or password/)
      end

      it 'returns a unauthorized status' do
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

def json
  JSON.parse(response.body)
end
