/**
 * CHALLENGE POST DEBUG V2 - Comprehensive tracking system
 * Each checkpoint has a unique ID to track data flow
 */

export class ChallengeDebugV2 {
  private static checkpoints: Map<string, any> = new Map();
  private static flowId: string = '';

  static startNewFlow() {
    this.flowId = `flow-${Date.now()}`;
    this.checkpoints.clear();
    if (__DEV__) console.log(`\n${'='.repeat(80)}`);
    if (__DEV__) console.log(`🚀 STARTING NEW CHALLENGE POST FLOW: ${this.flowId}`);
    if (__DEV__) console.log(`${'='.repeat(80)}\n`);
  }

  static checkpoint(id: string, description: string, data: any) {
    const checkpoint = {
      id,
      description,
      timestamp: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data)) // Deep clone to preserve state
    };
    
    this.checkpoints.set(id, checkpoint);
    
    // Log with clear formatting
    if (__DEV__) console.log(`\n📍 CHECKPOINT ${id}: ${description}`);
    if (__DEV__) console.log(`   Flow: ${this.flowId}`);
    if (__DEV__) console.log(`   Time: ${checkpoint.timestamp}`);
    
    // Log specific challenge fields
    if (data) {
      const challengeData = {
        // Check both naming conventions
        isChallenge: data.isChallenge ?? data.is_challenge,
        challengeName: data.challengeName ?? data.challenge_name,
        challengeId: data.challengeId ?? data.challenge_id,
        challengeProgress: data.challengeProgress ?? data.challenge_progress,
        leaderboardPosition: data.leaderboardPosition ?? data.leaderboard_position,
        totalParticipants: data.totalParticipants ?? data.total_participants
      };
      
      if (__DEV__) console.log(`   Challenge Data:`, challengeData);
      
      // Check if ANY challenge data exists
      const hasAnyChallenge = Object.values(challengeData).some(v => v !== undefined && v !== null && v !== false);
      if (__DEV__) console.log(`   ✅ Has Challenge Data: ${hasAnyChallenge ? 'YES' : 'NO'}`);
      
      // Log full data for debugging
      if (__DEV__) console.log(`   Full Data:`, data);
    }
    
    return checkpoint;
  }

  static compareCheckpoints(id1: string, id2: string) {
    const cp1 = this.checkpoints.get(id1);
    const cp2 = this.checkpoints.get(id2);
    
    if (!cp1 || !cp2) {
      if (__DEV__) console.error(`❌ Cannot compare: Missing checkpoint ${!cp1 ? id1 : id2}`);
      return;
    }
    
    if (__DEV__) console.log(`\n🔍 COMPARING ${id1} → ${id2}`);
    
    const fields = ['isChallenge', 'is_challenge', 'challengeName', 'challenge_name', 'challengeId', 'challenge_id'];
    
    fields.forEach(field => {
      const val1 = cp1.data?.[field];
      const val2 = cp2.data?.[field];
      
      if (val1 !== val2) {
        if (__DEV__) console.log(`   ⚠️  ${field}: "${val1}" → "${val2}" ${val2 === undefined ? '(LOST!)' : '(CHANGED)'}`);
      } else if (val1 !== undefined) {
        if (__DEV__) console.log(`   ✅ ${field}: "${val1}" (preserved)`);
      }
    });
  }

  static generateReport() {
    if (__DEV__) console.log(`\n${'='.repeat(80)}`);
    if (__DEV__) console.log(`📊 FLOW REPORT: ${this.flowId}`);
    if (__DEV__) console.log(`${'='.repeat(80)}`);
    
    const checkpointArray = Array.from(this.checkpoints.values());
    
    checkpointArray.forEach((cp, index) => {
      const hasChallenge = cp.data?.isChallenge || cp.data?.is_challenge;
      const icon = hasChallenge ? '✅' : '❌';
      if (__DEV__) console.log(`${icon} ${cp.id}: ${cp.description}`);
      
      if (index > 0) {
        const prevCp = checkpointArray[index - 1];
        const prevHasChallenge = prevCp.data?.isChallenge || prevCp.data?.is_challenge;
        
        if (prevHasChallenge && !hasChallenge) {
          if (__DEV__) console.log(`   🔴 DATA LOST HERE! Challenge data disappeared between ${prevCp.id} and ${cp.id}`);
        }
      }
    });
    
    if (__DEV__) console.log(`\n${'='.repeat(80)}\n`);
  }
}

// Export for components to use
export default ChallengeDebugV2;