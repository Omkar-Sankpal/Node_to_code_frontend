import { create } from 'zustand'
import axios from 'axios'

const API = 'http://localhost:8080/api/arena'

const useArenaStore = create((set, get) => ({
  /* ── State ── */
  activeTest: null,       // currently running test (or null)
  history: [],            // completed tests list
  stats: null,            // aggregated stats for profile
  recommendation: null,   // AI-powered topic recommendation after test
  recommendationLoading: false,
  loading: false,
  error: null,

  /* ── Start a new test ── */
  startTest: async (mode) => {
    set({ loading: true, error: null })
    try {
      const res = await axios.post(`${API}/start`, { mode })
      set({ activeTest: res.data, loading: false })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to start test'
      set({ error: msg, loading: false })
      return null
    }
  },

  /* ── Finish / submit a test ── */
  finishTest: async (testId, solvedProblemIds) => {
    set({ loading: true, error: null })
    try {
      const res = await axios.post(`${API}/${testId}/finish`, { solvedProblemIds })
      set({ activeTest: null, loading: false })
      return res.data // contains score, badge, etc.
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to finish test'
      set({ error: msg, loading: false })
      return null
    }
  },

  /* ── Get currently active test ── */
  fetchActiveTest: async () => {
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${API}/active`)
      const test = res.data?.active ? res.data : null
      set({ activeTest: test, loading: false })
      return test
    } catch (err) {
      set({ error: null, activeTest: null, loading: false })
      return null
    }
  },

  /* ── Get test history ── */
  fetchHistory: async () => {
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${API}/history`)
      set({ history: Array.isArray(res.data) ? res.data : [], loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  /* ── Get arena stats (for profile page) ── */
  fetchStats: async () => {
    try {
      const res = await axios.get(`${API}/stats`)
      set({ stats: res.data })
      return res.data
    } catch {
      return null
    }
  },

  /* ── Get AI-powered topic recommendation ── */
  fetchRecommendation: async (solvedTopics) => {
    if (!solvedTopics || solvedTopics.length === 0) {
      set({ recommendation: null })
      return null
    }
    set({ recommendationLoading: true })
    try {
      const res = await axios.post(`${API}/recommend`, { solvedTopics })
      set({ recommendation: res.data, recommendationLoading: false })
      return res.data
    } catch (err) {
      console.error('Recommendation fetch failed:', err)
      set({ recommendation: null, recommendationLoading: false })
      return null
    }
  },

  /* ── Clear ── */
  clearError: () => set({ error: null }),
  clearActive: () => set({ activeTest: null }),
  clearRecommendation: () => set({ recommendation: null }),
}))

export default useArenaStore
