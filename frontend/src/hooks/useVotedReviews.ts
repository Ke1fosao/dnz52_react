import { useState, useCallback, useEffect } from 'react';

/**
 * Зберігає у localStorage які відгуки користувач вже лайкнув/дизлайкнув,
 * щоб одна людина не могла спамити голосування.
 *
 * Структура у localStorage:
 *   dnz52:voted-reviews → { "12": "like", "15": "dislike", ... }
 */

const STORAGE_KEY = 'dnz52:voted-reviews';

type VoteType = 'like' | 'dislike';
type VotedMap = Record<string, VoteType>;

function readStorage(): VotedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(votes: VotedMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch {
    // localStorage може бути недоступний (privacy mode)
  }
}

export function useVotedReviews() {
  const [votes, setVotes] = useState<VotedMap>({});

  // Завантажуємо з localStorage при першому рендері
  useEffect(() => {
    setVotes(readStorage());
  }, []);

  const getVote = useCallback((reviewId: number): VoteType | null => {
    return votes[String(reviewId)] || null;
  }, [votes]);

  const setVote = useCallback((reviewId: number, vote: VoteType) => {
    setVotes(prev => {
      const next = { ...prev, [String(reviewId)]: vote };
      writeStorage(next);
      return next;
    });
  }, []);

  const hasVoted = useCallback((reviewId: number): boolean => {
    return !!votes[String(reviewId)];
  }, [votes]);

  return { getVote, setVote, hasVoted };
}
