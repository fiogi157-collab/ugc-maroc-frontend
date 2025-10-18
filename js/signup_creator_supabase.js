import { supabase } from './supabaseClient.js'

const form = document.getElementById('signup-creator-form')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const full_name = document.getElementById('fullname').value.trim()
  const username = document.getElementById('username').value.trim()
  const phone = document.getElementById('phone').value.trim()
  const cin = document.getElementById('cin').value.trim()
  const birth_date = document.getElementById('birth-date').value
  const city = document.getElementById('ville').value.trim()
  const bio = document.getElementById('bio').value.trim()
  const bank_name = document.getElementById('bank-name').value.trim()
  const rib = document.getElementById('rib').value.trim()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, role: 'creator' } }
  })

  if (error) {
    alert('❌ Erreur: ' + error.message)
    return
  }

  const user = data.user
  if (!user) {
    alert('Erreur: utilisateur non créé.')
    return
  }

  await supabase.from('profiles').insert({
    user_id: user.id,
    email,
    full_name,
    phone,
    role: 'creator'
  })

  await supabase.from('creators').insert({
    user_id: user.id,
    username,
    bio,
    cin,
    birth_date,
    city,
    bank_name,
    rib
  })

  await supabase.from('wallets').insert({
    user_id: user.id,
    bank_name,
    rib,
    balance: 0
  })

  alert('✅ Compte créateur créé avec succès ! Vérifie ton e-mail pour confirmer ton inscription.')
  window.location.href = '/creator/dashboard.html'
})
