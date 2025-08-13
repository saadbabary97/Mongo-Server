# Door Update Error Debugging Guide

## Issue
You're experiencing a "Failed to update door" error when trying to update door records.

## What I Fixed

### 1. Enhanced Error Handling
- Added detailed error messages with specific error details
- Added validation for required fields (ID, update data)
- Added MongoDB ObjectId validation
- Added database connection status checks

### 2. Improved Validation
- **ID Validation**: Ensures the door ID is provided and is a valid MongoDB ObjectId
- **Update Data Validation**: Ensures there's actual data to update
- **Required Fields Validation**: For create operations, validates all required fields

### 3. Better Logging
- Added request logging to see exactly what's being sent
- Added detailed error logging for debugging
- Added database connection status monitoring

### 4. Code Cleanup
- Removed duplicate `doorController.js` file that wasn't being used
- Consolidated all door operations in `doorRoutes.js`

### 5. Bulk Update Feature
- **New Endpoint**: `/api/doors/bulk-update` for updating multiple doors at once
- **Material-based Updates**: Update all doors with the same material
- **Flexible Criteria**: Update doors based on any field criteria
- **Batch Operations**: Efficiently update hundreds of doors in one request

## How to Debug

### Step 1: Check Server Status
```bash
curl http://localhost:8080/health
```

### Step 2: Check Database Connection
```bash
curl http://localhost:8080/
```

### Step 3: Run the Test Script
```bash
cd mongo-server
node test-door-update.js
```

### Step 4: Check Server Logs
Look for detailed error messages in your server console when making update requests.

## Common Causes of "Failed to update door"

### 1. Invalid Door ID
- **Problem**: The ID is not a valid MongoDB ObjectId
- **Solution**: Ensure you're passing a valid 24-character hexadecimal string

### 2. Missing Door ID
- **Problem**: The `id` field is missing from the request body
- **Solution**: Include `id` in your request body

### 3. No Update Data
- **Problem**: Request body only contains the ID, no actual data to update
- **Solution**: Include the fields you want to update

### 4. Database Connection Issues
- **Problem**: MongoDB is not connected
- **Solution**: Check if MongoDB is running and accessible

### 5. Door Not Found
- **Problem**: The door with the specified ID doesn't exist
- **Solution**: Verify the door exists before updating

## Example Valid Update Request

```json
{
  "id": "507f1f77bcf86cd799439011",
  "material": "Steel",
  "dimensions": {
    "height": 84,
    "width": 40
  }
}
```

## New: Bulk Update Feature

### Update All Doors with Same Material

```json
{
  "criteria": { "material": "Wood" },
  "updateData": { "DoorFinish": "Gloss" }
}
```

**This will update ALL doors with material "Wood" to have DoorFinish "Gloss"**

### Update All Doors (Global Update)

```json
{
  "criteria": {},
  "updateData": { "quality": "Premium" }
}
```

**This will update ALL doors in the database to have quality "Premium"**

### Update Doors by Multiple Criteria

```json
{
  "criteria": { 
    "material": "Steel", 
    "dimensions.height": { "$gte": 80 } 
  },
  "updateData": { "DoorFinish": "Powder Coat" }
}
```

**This will update all Steel doors with height >= 80 inches**

## Testing the Fix

1. **Start your server**: `node server.js`
2. **Run the test script**: `node test-door-update.js`
3. **Test bulk update**: `node test-bulk-update.js`
4. **Check the console output** for detailed error information
5. **Look at server logs** for request details and error traces

## If the Error Persists

1. Check the server console for detailed error logs
2. Verify MongoDB is running: `mongosh` or `mongo`
3. Check if the database `revit` exists and has a `doors` collection
4. Ensure your request includes all required fields
5. Verify the door ID exists in the database

## API Endpoints

- `GET /api/doors` - Get all doors
- `POST /api/doors/add` - Create a new door
- `PATCH /api/doors/update` - Update an existing door
- `PATCH /api/doors/bulk-update` - Update multiple doors by criteria
- `DELETE /api/doors/delete` - Delete a door
- `POST /api/doors/batch` - Create multiple doors at once

## Bulk Update Use Cases

1. **Material Changes**: Update all Wood doors to new finish
2. **Quality Updates**: Mark all doors as Premium quality
3. **Batch Maintenance**: Update maintenance dates for all doors
4. **Price Updates**: Update pricing for all doors of same type
5. **Status Changes**: Mark all doors as "In Stock" or "Out of Stock"
