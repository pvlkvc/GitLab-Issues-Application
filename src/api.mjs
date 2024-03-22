import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Requests the OAuth token for GitLab API.
 * @param {string} returnedCode obtained from previous authorize redirect
 * @returns {object} user info as json
 */
export async function requestToken (returnedCode) {
  const url = process.env.BASE_URL + '/oauth/token'
  const parameters = {
    client_id: process.env.GITLAB_APP_ID,
    client_secret: process.env.GITLAB_APP_SECRET,
    code: returnedCode,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GITLAB_CALLBACK_URL
  }
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters)
  }
  return await fetchf(url, options)
}

/**
 * Fetches info on the currently authorized user via GitLab API.
 * @param {string} token oauth bearer authorization token
 * @returns {object} user info as json
 */
export async function getUserInfo (token) {
  const url = process.env.BASE_URL + '/api/v4/user/'
  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  return await fetchf(url, options)
}

/**
 * Fetches repositories that the user is a member of, via GitLab API.
 * @param {string} token oauth bearer authorization token
 * @returns {object} user info as json
 */
export async function getRepositories (token) {
  const url = process.env.BASE_URL + '/api/v4/projects?membership=true'
  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  return await fetchf(url, options)
}


/**
 * Fetches repository webhooks list via GitLab API.
 * @param {string} repository id
 * @param {string} token oauth bearer authorization token
 * @returns {object} issues as json
 */
export async function getWebhooks (repository, token) {
  const url = process.env.BASE_URL + '/api/v4/projects/' + repository + '/hooks'

  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }

  return await fetchf(url, options)
}

/**
 * Creates a webhook via GitLab API.
 * @param {string} repository id
 * @param {string} webhookId unique id.
 * @param {string} token oauth bearer authorization token
 * @returns {object} issues as json
 */
export async function createWebhook (repository, webhookId, token) {
  const url = process.env.BASE_URL + '/api/v4/projects/' + repository + '/hooks'

  const hookData = {
    url: 'https://cscloud7-207.lnu.se/b3/webhook/' + webhookId,
    enable_ssl_verification: true,
    issues_events: true,
    token: process.env.GITLAB_HOOK_TOKEN
  }

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(hookData)
  }

  return await fetchf(url, options)
}

/**
 * Fetches issue list via GitLab API.
 * @param {string} repository id
 * @param {string} token oauth bearer authorization token
 * @returns {object} issues as json
 */
export async function getIssues (repository, token) {
  const url = process.env.BASE_URL + '/api/v4/projects/' + repository + '/issues?per_page=50'
  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  return await fetchf(url, options)
}

/**
 * Fetches notes/comments on issue list via GitLab API.
 * @param {string} repository id
 * @param {string} issue id
 * @param {string} token oauth bearer authorization token
 * @returns {object} notes as json
 */
export async function getIssueNotes (repository, issue, token) {
  const url = process.env.BASE_URL + '/api/v4/projects/' + repository + '/issues/' + issue + '/notes'
  const options = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  return await fetchf(url, options)
}

/**
 * Simple fetch call.
 * @param {string} url to fetch from
 * @param {object} options for the request
 * @returns {object} response json
 */
async function fetchf (url, options) {
  const resp = await fetch(url, options)
  return await resp.json()
}