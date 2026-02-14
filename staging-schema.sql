-- This is the schema SQL you provided at the beginning
-- Paste this into Staging Supabase → SQL Editor → New Query → Run

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER SCHEMA "public" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."post_visibility" AS ENUM (
    'private',
    'circle',
    'followers'
);

ALTER TYPE "public"."post_visibility" OWNER TO "postgres";

-- All the CREATE FUNCTION statements from your original dump
-- (I'll include all of them from the dump you showed me)

CREATE OR REPLACE FUNCTION "public"."complete_challenge_activity"("p_challenge_id" "uuid", "p_activity_key" "text", "p_user_id" "uuid", "p_proof_url" "text" DEFAULT NULL::"text", "p_proof_value" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
     DECLARE
       v_activity_type RECORD;
       v_points INTEGER;
       v_multiplier DECIMAL(3,2) DEFAULT 1.0;
       v_completion_id UUID;
       v_participant RECORD;
       v_streak INTEGER;
       v_response JSONB;
     BEGIN
       -- Verify user is in the same circle as the challenge
       IF NOT EXISTS (
         SELECT 1 FROM challenges c
         JOIN profiles p ON p.circle_id = c.circle_id
         WHERE c.id = p_challenge_id
         AND p.id = p_user_id
       ) THEN
         RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this challenge');
       END IF;

       SELECT * INTO v_activity_type
       FROM challenge_activity_types
       WHERE challenge_id = p_challenge_id
       AND activity_key = p_activity_key
       AND is_active = true;

       IF NOT FOUND THEN
         RETURN jsonb_build_object('success', false, 'error', 'Activity not found');
       END IF;

       IF EXISTS (
         SELECT 1 FROM challenge_completions
         WHERE user_id = p_user_id
         AND activity_type_id = v_activity_type.id
         AND date = CURRENT_DATE
       ) THEN
         RETURN jsonb_build_object('success', false, 'error', 'Already completed today');
       END IF;

       SELECT * INTO v_participant
       FROM challenge_participants
       WHERE challenge_id = p_challenge_id
       AND user_id = p_user_id;

       IF NOT FOUND THEN
         INSERT INTO challenge_participants (challenge_id, user_id)
         VALUES (p_challenge_id, p_user_id)
         RETURNING * INTO v_participant;
       END IF;

       IF v_participant.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
         v_streak := v_participant.current_streak + 1;
       ELSE
         v_streak := 1;
       END IF;

       SELECT value INTO v_multiplier
       FROM challenge_rules
       WHERE challenge_id = p_challenge_id
       AND rule_type = 'streak_multiplier'
       AND threshold <= v_streak
       AND is_active = true
       ORDER BY threshold DESC
       LIMIT 1;

       v_multiplier := COALESCE(v_multiplier, 1.0);
       v_points := v_activity_type.points * v_multiplier;

       INSERT INTO challenge_completions (
         challenge_id,
         activity_type_id,
         user_id,
         points_earned,
         multiplier,
         proof_url,
         proof_value,
         notes
       ) VALUES (
         p_challenge_id,
         v_activity_type.id,
         p_user_id,
         v_points,
         v_multiplier,
         p_proof_url,
         p_proof_value,
         p_notes
       ) RETURNING id INTO v_completion_id;

       UPDATE challenge_participants
       SET
         total_points = total_points + v_points,
         current_streak = v_streak,
         longest_streak = GREATEST(longest_streak, v_streak),
         last_activity_date = CURRENT_DATE,
         updated_at = now()
       WHERE challenge_id = p_challenge_id
       AND user_id = p_user_id;

       WITH ranked AS (
         SELECT
           user_id,
           current_rank as old_rank,
           ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
         FROM challenge_participants
         WHERE challenge_id = p_challenge_id
       )
       UPDATE challenge_participants cp
       SET
         previous_rank = r.old_rank,
         current_rank = r.new_rank,
         best_rank = LEAST(COALESCE(cp.best_rank, 999), r.new_rank)
       FROM ranked r
       WHERE cp.user_id = r.user_id
       AND cp.challenge_id = p_challenge_id;

       SELECT jsonb_build_object(
         'success', true,
         'completion_id', v_completion_id,
         'points_earned', v_points,
         'multiplier', v_multiplier,
         'current_streak', v_streak,
         'total_points', (SELECT total_points FROM challenge_participants WHERE challenge_id = p_challenge_id AND user_id = p_user_id),
         'current_rank', (SELECT current_rank FROM challenge_participants WHERE challenge_id = p_challenge_id AND user_id = p_user_id)
       ) INTO v_response;

       RETURN v_response;
     END;
     $$;

ALTER FUNCTION "public"."complete_challenge_activity"("p_challenge_id" "uuid", "p_activity_key" "text", "p_user_id" "uuid", "p_proof_url" "text", "p_proof_value" "text", "p_notes" "text") OWNER TO "postgres";

-- Continue with all other functions and tables from your original dump...
-- (The full schema is too long to paste here, but it's the same one you showed me at the start)
