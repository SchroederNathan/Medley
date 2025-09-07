// Test your new recommendation system

import { supabase } from "../lib/utils";

export class TestRecommendations {
  
  /**
   * Quick test to see if recommendations are working
   */
  static async testRecommendationSystem(userId: string) {
    console.log('🧪 Testing recommendation system...\n');
    
    try {
      // Test the database function we created
      const { data: recommendations, error } = await supabase
        .rpc('get_cross_media_recommendations', {
          target_user_id: userId,
          target_media_type: 'movie',
          recommendation_limit: 10
        });

      if (error) {
        console.error('❌ Database function error:', error);
        return;
      }

      if (!recommendations || recommendations.length === 0) {
        console.log('⚠️  No recommendations found. Possible reasons:');
        console.log('   - User has no rated/completed items yet');
        console.log('   - No compatible cross-media genres');
        console.log('   - User already has all available items');
        
        // Let's check what the user has
        await this.checkUserData(userId);
        return;
      }

      console.log(`✅ Found ${recommendations.length} recommendations!\n`);
      
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title} (${rec.media_type})`);
        console.log(`   Genres: [${rec.unified_genres?.join(', ') || 'none'}]`);
        console.log(`   Score: ${Math.round(rec.recommendation_score * 100)}%`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Check what data the user has for recommendations
   */
  static async checkUserData(userId: string) {
    console.log('🔍 Checking user data for recommendations...\n');
    
    // Check if user has any media items
    const { data: userMedia, count } = await supabase
      .from('user_media')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    console.log(`📊 User has ${count || 0} media items`);

    if (count && count > 0) {
      // Check completed/rated items
      const { data: completedItems } = await supabase
        .from('user_media_with_genres')
        .select('title, media_type, status, user_rating, unified_genres')
        .eq('user_id', userId)
        .in('status', ['completed', 'watching', 'reading', 'playing']);

      console.log(`📊 Items that could influence recommendations: ${completedItems?.length || 0}`);
      
      if (completedItems && completedItems.length > 0) {
        console.log('\n📝 User\'s completed/in-progress items:');
        completedItems.slice(0, 5).forEach(item => {
          console.log(`   ${item.title} (${item.media_type}) - ${item.status}`);
          console.log(`     Rating: ${item.user_rating || 'none'}`);
          console.log(`     Genres: [${item.unified_genres?.join(', ') || 'none'}]`);
        });
      }
    } else {
      console.log('💡 To get recommendations, user needs to:');
      console.log('   1. Add some media items to their lists');
      console.log('   2. Mark items as completed/watching/reading/playing');
      console.log('   3. Optionally rate items (improves recommendations)');
    }
  }

  /**
   * Add some test data for a user to see recommendations
   */
  static async addTestDataForUser(userId: string) {
    console.log('📝 Adding test data for user...\n');
    
    // Add some completed movies with ratings
    const testItems = [
      { 
        mediaId: 'a6c912ce-2c9f-436a-8d09-21355d712535', // War of the Worlds
        status: 'completed',
        rating: 4
      },
      {
        mediaId: '64c46507-c445-40e4-8dce-0602f2263377', // F1
        status: 'completed', 
        rating: 5
      }
    ];

    for (const item of testItems) {
      const { error } = await supabase
        .from('user_media')
        .upsert({
          user_id: userId,
          media_id: item.mediaId,
          status: item.status,
          user_rating: item.rating,
          added_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error adding test item:`, error);
      } else {
        console.log(`✅ Added test item with rating ${item.rating}`);
      }
    }

    console.log('\n🎉 Test data added! Now try testing recommendations again.');
  }

  /**
   * Test the React Hook version
   */
  static getRecommendationHookTest(userId: string, mediaType: 'movie' | 'tv' | 'game') {
    return `
// Test this in your React component:

import { useQuery } from '@tanstack/react-query';

const useRecommendations = (userId: string, targetMediaType: 'movie' | 'tv' | 'game') => {
  return useQuery({
    queryKey: ['recommendations', userId, targetMediaType],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_cross_media_recommendations', {
          target_user_id: userId,
          target_media_type: targetMediaType,
          recommendation_limit: 20
        });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
};

// Usage in component:
const { data: recommendations, isLoading } = useRecommendations('${userId}', '${mediaType}');
console.log('Recommendations:', recommendations);
    `;
  }
}

// Usage:
// 1. Test with your user ID: await TestRecommendations.testRecommendationSystem('your-user-id');
// 2. If no recommendations, add test data: await TestRecommendations.addTestDataForUser('your-user-id');
// 3. Get React hook code: console.log(TestRecommendations.getRecommendationHookTest('your-user-id', 'movie'));