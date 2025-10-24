// Test script pour vérifier l'API Workers
const API_URL = 'http://localhost:8787'

async function testAPI() {
  try {
    console.log('🧪 Testing UGC Maroc Workers API...')
    
    // Test health check
    const healthResponse = await fetch(`${API_URL}/api/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData)
    
    // Test campaigns
    const campaignsResponse = await fetch(`${API_URL}/api/campaigns`)
    const campaignsData = await campaignsResponse.json()
    console.log('✅ Campaigns:', campaignsData)
    
    // Test gigs
    const gigsResponse = await fetch(`${API_URL}/api/gigs`)
    const gigsData = await gigsResponse.json()
    console.log('✅ Gigs:', gigsData)
    
    console.log('🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAPI()
