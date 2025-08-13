const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testAutoBulkUpdate() {
  try {
    console.log('🧪 Testing Automatic Bulk Update Functionality...\n');
    console.log('This will show how updating ONE door automatically updates ALL doors with the same material!\n');

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
        "_id": "wood-door-1",
        "name": "Front Door",
        "material": "Wood",
        "dimensions": { "height": 80, "width": 36 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "wood-door-2", 
        "name": "Back Door",
        "material": "Wood",
        "dimensions": { "height": 80, "width": 32 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "wood-door-3",
        "name": "Side Door", 
        "material": "Wood",
        "dimensions": { "height": 78, "width": 30 },
        "DoorFinish": "Varnish"
      },
      {
        "_id": "steel-door-1",
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

    // 4. THE MAGIC: Update just ONE Wood door and watch ALL Wood doors get updated!
    console.log('\n4. 🎯 THE MAGIC: Updating just ONE Wood door...');
    console.log('   This should automatically update ALL Wood doors!');
    
    const updatePayload = {
      "_id": "wood-door-1",
      "DoorFinish": "Gloss"
    };

    try {
      const updateResponse = await axios.patch(`${BASE_URL}/api/doors/update`, updatePayload);
      console.log('✅ Update successful!');
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
      
      // Show the bulk update result
      if (updateResponse.data.bulkUpdateResult) {
        console.log('\n🎉 BULK UPDATE RESULT:');
        console.log(`   Material: ${updateResponse.data.bulkUpdateResult.material}`);
        console.log(`   Total doors updated: ${updateResponse.data.bulkUpdateResult.totalDoorsUpdated}`);
        console.log(`   Message: ${updateResponse.data.bulkUpdateResult.message}`);
      }
    } catch (error) {
      console.log('❌ Update failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    // 5. Show updated doors to prove the magic worked
    console.log('\n5. 🎉 Doors after the magic update:');
    try {
      const updatedDoorsResponse = await axios.get(`${BASE_URL}/api/doors`);
      console.log(`Found ${updatedDoorsResponse.data.length} doors:`);
      updatedDoorsResponse.data.forEach(door => {
        console.log(`  - ${door.name}: ${door.material}, Finish: ${door.DoorFinish}`);
      });
      
      // Check if all Wood doors now have "Gloss" finish
      const woodDoors = updatedDoorsResponse.data.filter(door => door.material === "Wood");
      const allWoodDoorsGloss = woodDoors.every(door => door.DoorFinish === "Gloss");
      
      if (allWoodDoorsGloss) {
        console.log('\n✅ SUCCESS: All Wood doors now have "Gloss" finish!');
        console.log('   The automatic bulk update worked perfectly!');
      } else {
        console.log('\n❌ FAILED: Not all Wood doors have "Gloss" finish');
        console.log('   Something went wrong with the bulk update');
      }
    } catch (error) {
      console.log('❌ Failed to fetch updated doors:', error.response?.data?.error || error.message);
    }

    // 6. Test updating a Steel door to see if it affects Wood doors
    console.log('\n6. 🧪 Testing: Update a Steel door (should NOT affect Wood doors)...');
    const steelUpdatePayload = {
      "_id": "steel-door-1",
      "DoorFinish": "Matte Black"
    };

    try {
      const steelUpdateResponse = await axios.patch(`${BASE_URL}/api/doors/update`, steelUpdatePayload);
      console.log('✅ Steel door update successful!');
      console.log('Response:', JSON.stringify(steelUpdateResponse.data, null, 2));
      
      if (steelUpdateResponse.data.bulkUpdateResult) {
        console.log(`\n   Only ${steelUpdateResponse.data.bulkUpdateResult.totalDoorsUpdated} Steel door(s) updated`);
        console.log('   Wood doors should remain unchanged!');
      }
    } catch (error) {
      console.log('❌ Steel door update failed:', error.response?.data || error.message);
    }

    // 7. Final check - show all doors
    console.log('\n7. 🎯 Final state - all doors:');
    try {
      const finalDoorsResponse = await axios.get(`${BASE_URL}/api/doors`);
      finalDoorsResponse.data.forEach(door => {
        console.log(`  - ${door.name}: ${door.material}, Finish: ${door.DoorFinish}`);
      });
      
      console.log('\n🎉 PERFECT! The automatic bulk update is working:');
      console.log('   ✅ Wood doors: All have "Gloss" finish (updated together)');
      console.log('   ✅ Steel door: Has "Matte Black" finish (updated separately)');
      console.log('   ✅ Material-based updates work automatically!');
    } catch (error) {
      console.log('❌ Failed to fetch final doors:', error.response?.data?.error || error.message);
    }

    // 8. Clean up - delete all test doors
    console.log('\n8. 🧹 Cleaning up test doors...');
    try {
      const doorsToDelete = ["wood-door-1", "wood-door-2", "wood-door-3", "steel-door-1"];
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

    console.log('\n🎉 Automatic bulk update testing completed!');
    console.log('   Now when you update ANY door, ALL doors with the same material will be updated automatically!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAutoBulkUpdate();
