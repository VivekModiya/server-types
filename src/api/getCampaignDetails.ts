export const getCampaignDetails = () => {
  const res = fetch('/api/v3/campaigns/{123}', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// @
