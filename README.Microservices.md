# Microservice Architecture Guide

## Overview

This project uses a microservice architecture with the following components:

1. **Main Service (test-prisma)** - The service you're currently in, which handles user management and product data
2. **Profile Microservice** - A separate service for managing sensitive user profile data

## Communication Pattern

The services communicate via Kafka with these key features:

1. **Reliable Topic Management** - Automatic creation of topics to prevent "topic not found" errors
2. **Request-Response Pattern** - Uses correlation IDs to match requests with responses
3. **Fault Tolerance** - Handles failed requests with appropriate error messages

## Data Flow

### User Creation Flow

1. Frontend sends user creation request to Main Service
2. Main Service extracts profile data (firstName, lastName, nationalCode, email, birthDate)
3. Main Service sends profile creation request to Profile Service via Kafka
4. Profile Service creates profile and returns profileId
5. Main Service stores local user with profileId and other fields (jobPosition, phone, address)
6. Main Service responds to frontend with combined data

### User Retrieval Flow

1. Frontend requests user data from Main Service
2. Main Service fetches local user data
3. Main Service requests profile data from Profile Service via Kafka
4. Main Service combines local and profile data
5. Main Service responds to frontend with complete user data

## Kafka Topic Structure

```
CREATE_PROFILE -> Profile Service
CREATE_PROFILE_RESPONSE -> Main Service
GET_PROFILE -> Profile Service
GET_PROFILE_RESPONSE -> Main Service
GET_PROFILES -> Profile Service
GET_PROFILES_RESPONSE -> Main Service
UPDATE_PROFILE -> Profile Service
UPDATE_PROFILE_RESPONSE -> Main Service
DELETE_PROFILE -> Profile Service
DELETE_PROFILE_RESPONSE -> Main Service
ENSURE_TOPICS_EXIST -> Topic Manager
TOPICS_ENSURED -> Confirmation
```

## API Endpoints

### Standard User Endpoints

- `POST /v1/users` - Create a user (local only)
- `GET /v1/users` - List users (local data only)
- `GET /v1/users/:id` - Get a single user (local data only)
- `PUT /v1/users/:id` - Update a user (local data only)
- `DELETE /v1/users/:id` - Delete a user (local data only)

### Integrated User+Profile Endpoints

- `POST /v1/users/with-profile` - Create a user with profile
- `GET /v1/users/with-profiles` - List users with their profiles
- `GET /v1/users/with-profile/:id` - Get a single user with profile
- `PUT /v1/users/with-profile/:id` - Update a user and their profile
- `DELETE /v1/users/with-profile/:id` - Delete a user and optionally their profile

## Development Guide

### Key Components

1. **KafkaTopicManager** - Ensures topics exist before using them
2. **ProfilesService** - Client for the Profile microservice
3. **UsersProfileService** - Handles integration between users and profiles

### Adding New Microservice Features

1. Define message types in interfaces
2. Add Kafka topics to KafkaMessagingEvents enum
3. Create service client to handle communication
4. Use sendAndReceive for request-response pattern
5. Implement error handling and logging

### Error Handling Strategy

1. **Service Unavailability** - Log errors and return appropriate status
2. **Topic Not Found** - Automatically create missing topics
3. **Request Timeout** - Set appropriate timeouts for microservice calls
