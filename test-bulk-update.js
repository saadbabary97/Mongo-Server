const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testBulkUpdate() {
  try {
    console.log('🧪 Testing Bulk Update Functionality...\n');

    // 1. Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server is not running');
      return;
    }

    // 2. Create multiple doors with the same material
    console.log('\n2. Creating multiple doors with same material...');
    const doors = [
      {
        "_id": "door-1-wood",
        "name": "Front Door",
        "material": "Wood",
        "dimensions": { "height": 80, "width": 36 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "door-2-wood", 
        "name": "Back Door",
        "material": "Wood",
        "dimensions": { "height": 80, "width": 32 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "door-3-wood",
        "name": "Side Door", 
        "material": "Wood",
        "dimensions": { "height": 78, "width": 30 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "door-4-steel",
        "name": "Garage Door",
        "material": "Steel", 
        "dimensions": { "height": 84, "width": 120 },
        "DoorFinish": "Powder Coat"
      }
    ];

    for (const door of doors) {
      try {
        await axios.post(`${BASE_URL}/api/doors/add`, door);
        console.log(`✅ Created door: ${door.name} (${door.material})`);
      } catch (error) {
        console.log(`❌ Failed to create door ${door.name}:`, error.response?.data?.error || error.message);
      }
    }

    // 3. Show current doors
    console.log('\n3. Current doors in database:');
    try {
      const doorsResponse = await axios.get(`${BASE_URL}/api/doors`);
      console.log(`Found ${doorsResponse.data.length} doors:`);
      doorsResponse.data.forEach(door => {
        console.log(`  - ${door.name}: ${door.material}, Finish: ${door.DoorFinish}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch doors:', error.response?.data?.error || error.message);
    }

    // 4. Test bulk update - update all Wood doors to have "Gloss" finish
    console.log('\n4. Testing bulk update - updating all Wood doors to Gloss finish...');
    const bulkUpdatePayload = {
      "criteria": { "material": "Wood" },
      "updateData": { "DoorFinish": "Gloss" }
    };

    try {
      const bulkUpdateResponse = await axios.patch(`${BASE_URL}/api/doors/bulk-update`, bulkUpdatePayload);
      console.log('✅ Bulk update successful!');
      console.log('Response:', JSON.stringify(bulkUpdateResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Bulk update failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    // 5. Show updated doors
    console.log('\n5. Doors after bulk update:');
    try {
      const updatedDoorsResponse = await axios.get(`${BASE_URL}/api/doors`);
      console.log(`Found ${updatedDoorsResponse.data.length} doors:`);
      updatedDoorsResponse.data.forEach(door => {
        console.log(`  - ${door.name}: ${door.material}, Finish: ${door.DoorFinish}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch updated doors:', error.response?.data?.error || error.message);
    }

    // 6. Test another bulk update - update all doors to have "Premium" quality
    console.log('\n6. Testing another bulk update - adding Premium quality to all doors...');
    const qualityUpdatePayload = {
      "criteria": {}, // Empty criteria means update ALL doors
      "updateData": { "quality": "Premium" }
    };

    try {
      const qualityUpdateResponse = await axios.patch(`${BASE_URL}/api/doors/bulk-update`, qualityUpdatePayload);
      console.log('✅ Quality update successful!');
      console.log('Response:', JSON.stringify(qualityUpdateResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Quality update failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    // 7. Clean up - delete all test doors
    console.log('\n7. Cleaning up test doors...');
    try {
      const doorsToDelete = ["door-1-wood", "door-2-wood", "door-3-wood", "door-4-steel"];
      for (const doorId of doorsToDelete) {
        try {
          await axios.delete(`${BASE_URL}/api/doors/delete`, { data: { _id: doorId } });
          console.log(`✅ Deleted door: ${doorId}`);
        } catch (deleteError) {
          console.log(`❌ Failed to delete door ${doorId}:`, deleteError.response?.data?.error || deleteError.message);
        }
      }
    } catch (error) {
      console.log('❌ Cleanup failed:', error.message);
    }

    console.log('\n🎉 Bulk update testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testBulkUpdate();
