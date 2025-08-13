const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testDoorUpdate() {
  try {
    console.log('🧪 Testing Door Update Functionality...\n');

    // 1. First, let's check if the server is running
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }

    // 2. Check database connection
    console.log('\n2. Checking database connection...');
    try {
      const rootResponse = await axios.get(`${BASE_URL}/`);
      console.log('✅ Database status:', rootResponse.data.database);
    } catch (error) {
      console.log('❌ Could not check database status');
    }

    // 3. Get existing doors to see what we're working with
    console.log('\n3. Fetching existing doors...');
    try {
      const doorsResponse = await axios.get(`${BASE_URL}/api/doors`);
      console.log(`✅ Found ${doorsResponse.data.length} doors`);
      if (doorsResponse.data.length > 0) {
        console.log('First door:', JSON.stringify(doorsResponse.data[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Failed to fetch doors:', error.response?.data || error.message);
    }

    // 4. Test with your exact payload format
    console.log('\n4. Testing with your payload format...');
    const yourPayload = {
      "_id": "c1298650-8c8e-4b60-ba75-b40863aef683-000327b7",
      "DoorFinish": "Varnish"
    };

    console.log('Testing payload:', JSON.stringify(yourPayload, null, 2));

    try {
      const updateResponse = await axios.patch(`${BASE_URL}/api/doors/update`, yourPayload);
      console.log('✅ Door updated successfully!');
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    } catch (updateError) {
      console.log('❌ Door update failed:');
      console.log('Status:', updateError.response?.status);
      console.log('Error:', updateError.response?.data || updateError.message);
      
      // If the door doesn't exist, let's try to create it first
      if (updateError.response?.status === 404) {
        console.log('\n5. Door not found, trying to create it first...');
        const createPayload = {
          name: "Test Door",
          material: "Wood",
          dimensions: {
            height: 80,
            width: 36
          },
          _id: yourPayload._id,
          DoorFinish: yourPayload.DoorFinish
        };
        
        try {
          const createResponse = await axios.post(`${BASE_URL}/api/doors/add`, createPayload);
          console.log('✅ Test door created with your ID:', createResponse.data._id);
          
          // Now try to update it
          console.log('\n6. Now updating the created door...');
          const updateResponse2 = await axios.patch(`${BASE_URL}/api/doors/update`, yourPayload);
          console.log('✅ Door updated successfully after creation!');
          console.log('Response:', JSON.stringify(updateResponse2.data, null, 2));
          
          // Clean up
          console.log('\n7. Cleaning up test door...');
          try {
            await axios.delete(`${BASE_URL}/api/doors/delete`, { data: { _id: yourPayload._id } });
            console.log('✅ Test door deleted');
          } catch (deleteError) {
            console.log('❌ Failed to delete test door:', deleteError.response?.data || deleteError.message);
          }
          
        } catch (createError) {
          console.log('❌ Failed to create test door:', createError.response?.data || createError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testDoorUpdate();
