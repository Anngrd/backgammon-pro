/**
 * Supabase rooms table schema (run in your Supabase SQL editor):
 *
 * create table rooms (
 *   id uuid default gen_random_uuid() primary key,
 *   room_code text unique not null,
 *   game_type text not null default 'short',
 *   status text not null default 'waiting',
 *   player1_id text not null,
 *   player2_id text,
 *   player1_name text not null default 'Player 1',
 *   player2_name text default 'Player 2',
 *   game_state jsonb,
 *   current_turn text not null default 'player1',
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 *
 * -- Enable realtime on this table:
 * alter publication supabase_realtime add table rooms;
 */

import { supabase } from './supabase';
import { GameState } from '@/types/game';
import { GameVariant } from '@/types/game';

// Unambiguous characters for room codes
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

/** Get or create an anonymous player ID (persisted in localStorage) */
export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('bg_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('bg_player_id', id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('bg_player_name') || '';
}

export function savePlayerName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bg_player_name', name.trim());
  }
}

export interface Room {
  id: string;
  room_code: string;
  game_type: GameVariant;
  status: 'waiting' | 'playing' | 'finished';
  player1_id: string;
  player2_id: string | null;
  player1_name: string;
  player2_name: string | null;
  game_state: GameState | null;
  current_turn: 'player1' | 'player2';
  created_at: string;
  updated_at: string;
}

export async function createRoom(
  gameType: GameVariant,
  player1Id: string,
  player1Name: string
): Promise<{ room: Room | null; error: string | null }> {
  // Try up to 5 codes in case of collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const room_code = generateRoomCode();
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        room_code,
        game_type: gameType,
        status: 'waiting',
        player1_id: player1Id,
        player1_name: player1Name || 'Player 1',
        current_turn: 'player1',
      })
      .select()
      .single();

    if (!error) return { room: data as Room, error: null };
    // If it's not a uniqueness collision, bail
    if (!error.message?.includes('unique')) {
      return { room: null, error: error.message };
    }
  }
  return { room: null, error: 'Could not generate unique room code' };
}

export async function joinRoom(
  roomCode: string,
  player2Id: string,
  player2Name: string
): Promise<{ room: Room | null; error: 'room_not_found' | 'game_started' | 'game_finished' | 'error' | null }> {
  const { data: rows } = await supabase
    .from('rooms')
    .select()
    .eq('room_code', roomCode.toUpperCase().trim())
    .limit(1);

  if (!rows || rows.length === 0) return { room: null, error: 'room_not_found' };

  const room = rows[0] as Room;
  if (room.status === 'playing')  return { room: null, error: 'game_started' };
  if (room.status === 'finished') return { room: null, error: 'game_finished' };

  const { data, error } = await supabase
    .from('rooms')
    .update({
      player2_id: player2Id,
      player2_name: player2Name || 'Player 2',
      status: 'playing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', room.id)
    .select()
    .single();

  if (error) return { room: null, error: 'error' };
  return { room: data as Room, error: null };
}

export async function getRoomByCode(roomCode: string): Promise<Room | null> {
  const { data } = await supabase
    .from('rooms')
    .select()
    .eq('room_code', roomCode.toUpperCase().trim())
    .single();
  return (data as Room) ?? null;
}

export async function pushGameState(
  roomId: string,
  gameState: GameState,
  currentTurn: 'player1' | 'player2'
): Promise<void> {
  await supabase
    .from('rooms')
    .update({
      game_state: gameState as unknown as Record<string, unknown>,
      current_turn: currentTurn,
      status: gameState.winner ? 'finished' : 'playing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);
}
