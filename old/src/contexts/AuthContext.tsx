// import React, { createContext, useContext, useEffect, useState } from 'react'
// import { User } from '@supabase/supabase-js'
// import { supabase, UserProfile } from '../lib/supabase'

// interface AuthContextType {
//   user: User | null
//   profile: UserProfile | null
//   loading: boolean
//   signIn: (email: string, password: string) => Promise<{ error?: string }>
//   signOut: () => Promise<void>
//   signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ error?: string }>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [profile, setProfile] = useState<UserProfile | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setUser(session?.user ?? null)
//       if (session?.user) {
//         fetchProfile(session.user.id)
//       } else {
//         setLoading(false)
//       }
//     })

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setUser(session?.user ?? null)
//         if (session?.user) {
//           await fetchProfile(session.user.id)
//         } else {
//           setProfile(null)
//           setLoading(false)
//         }
//       }
//     )

//     return () => subscription.unsubscribe()
//   }, [])

//   const fetchProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('user_profiles')
//         .select('*')
//         .eq('id', userId)
//         .single()

//       if (error) throw error
//       setProfile(data)
//     } catch (error) {
//       console.error('Error fetching profile:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const signIn = async (email: string, password: string) => {
//     try {
//       const { error } = await supabase.auth.signInWithPassword({ email, password })
//       if (error) return { error: error.message }
//       return {}
//     } catch (error) {
//       return { error: 'An unexpected error occurred' }
//     }
//   }

//   const signOut = async () => {
//     await supabase.auth.signOut()
//   }

//   const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({ email, password })
      
//       if (error) return { error: error.message }
      
//       if (data.user) {
//         const { error: profileError } = await supabase
//           .from('user_profiles')
//           .insert({
//             id: data.user.id,
//             email: email,
//             ...profileData
//           })
        
//         if (profileError) return { error: profileError.message }
//       }
      
//       return {}
//     } catch (error) {
//       return { error: 'An unexpected error occurred' }
//     }
//   }

//   const value = {
//     user,
//     profile,
//     loading,
//     signIn,
//     signOut,
//     signUp
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }


// import React, { createContext, useContext, useEffect, useState } from 'react'
// import { User } from '@supabase/supabase-js'
// import { supabase, UserProfile } from '../lib/supabase'

// interface AuthContextType {
//   user: User | null
//   profile: UserProfile | null
//   loading: boolean
//   signIn: (email: string, password: string) => Promise<{ error?: string }>
//   signOut: () => Promise<void>
//   signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ error?: string }>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [profile, setProfile] = useState<UserProfile | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     async function handleSession() {
//       try {
//         // Get initial session
//         const { data: { session }, error } = await supabase.auth.getSession();

//         if (error) {
//           throw error;
//         }

//         setUser(session?.user ?? null);
//         if (session?.user) {
//           await fetchProfile(session.user.id);
//         } else {
//           setLoading(false);
//         }
//       } catch (e) {
//         console.error('Error fetching session, clearing local storage:', e);
//         // If an error occurs, force a sign out to clear the bad session
//         await supabase.auth.signOut();
//         setUser(null);
//         setProfile(null);
//         setLoading(false);
//       }
//     }

//     handleSession();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setUser(session?.user ?? null);
//         if (session?.user) {
//           await fetchProfile(session.user.id);
//         } else {
//           setProfile(null);
//           setLoading(false);
//         }
//       }
//     )

//     return () => subscription.unsubscribe()
//   }, [])

//   const fetchProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('user_profiles')
//         .select('*')
//         .eq('id', userId)
//         .single()

//       if (error) throw error
//       setProfile(data)
//     } catch (error) {
//       console.error('Error fetching profile:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const signIn = async (email: string, password: string) => {
//     try {
//       const { error } = await supabase.auth.signInWithPassword({ email, password })
//       if (error) return { error: error.message }
//       return {}
//     } catch (error) {
//       return { error: 'An unexpected error occurred' }
//     }
//   }

//   const signOut = async () => {
//     await supabase.auth.signOut()
//   }

//   const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({ email, password })
      
//       if (error) return { error: error.message }
      
//       if (data.user) {
//         const { error: profileError } = await supabase
//           .from('user_profiles')
//           .insert({
//             id: data.user.id,
//             email: email,
//             ...profileData
//           })
        
//         if (profileError) return { error: profileError.message }
//       }
      
//       return {}
//     } catch (error) {
//       return { error: 'An unexpected error occurred' }
//     }
//   }

//   const value = {
//     user,
//     profile,
//     loading,
//     signIn,
//     signOut,
//     signUp
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }


import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null) // Ensure profile is null on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function handleSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Error fetching session, clearing local storage:', e);
        // Force a sign out to clear any bad session data
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    handleSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    )

    return () => subscription.unsubscribe();
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      
      if (error) return { error: error.message }
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            ...profileData
          })
        
        if (profileError) return { error: profileError.message }
      }
      
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    signUp
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}