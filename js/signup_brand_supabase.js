import { supabase } from './supabaseClient.js'

const form = document.getElementById('signup-brand-form')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const brand_name = document.getElementById('company-name').value.trim()
  const industry = document.getElementById('industry').value.trim()
  const website = document.getElementById('website').value.trim()
  const phone = document.getElementById('phone').value.trim()
  const contact_name = document.getElementById('contact-name').value.trim()
  const contact_position = document.getElementById('contact-position').value.trim()
  const city = document.getElementById('city').value.trim()
  const address = document.getElementById('address').value.trim()
  const monthly_budget = document.getElementById('monthly-budget').value.trim()
  const bio = document.getElementById('bio').value.trim()
  const bank_name = document.getElementById('bank-name')?.value?.trim() || ''
  const rib = document.getElementById('rib')?.value?.trim() || ''

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: brand_name, phone, role: 'brand' } }
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
    full_name: brand_name,
    phone,
    role: 'brand'
  })

  await supabase.from('brands').insert({
    user_id: user.id,
    brand_name,
    sector: industry,
    website,
    contact_name,
    contact_position,
    city,
    address,
    bio,
    monthly_budget
  })

  await supabase.from('wallets').insert({
    user_id: user.id,
    bank_name,
    rib,
    balance: 0
  })

  alert('✅ Compte marque créé avec succès ! Vérifie ton e-mail pour confirmer ton inscription.')
  window.location.href = '/brand/dashboard.html'
})
