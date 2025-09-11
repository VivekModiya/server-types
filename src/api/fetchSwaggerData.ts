// @ts-nocheck
import axios from 'axios'
import { getCookies } from '../utils/GetCookies'

const CONFIG = {
  BASE_URL: 'https://docs.stage.iqm.services',
  ENDPOINT: '/swagger/stage_internal_documentation.json',
}

let SESSION_ID = ''
let ACCESS_TOKEN = ''
let client

type AxiosClient = Promise<AxiosInstance | null | undefined> | null | undefined

const getAxiosClient = async (): AxiosClient => {
  if (client) {
    return client as AxiosClient
  }
  if (SESSION_ID && ACCESS_TOKEN) {
    return (client = axios.create({
      baseURL: CONFIG.BASE_URL,
      timeout: 10000,
      headers: {
        accept: 'application/json',
        'user-agent': 'VS Code Extension',
        cookie: `AUTHP_SESSION_ID=${SESSION_ID}; access_token_dev=${ACCESS_TOKEN}`,
      },
    })) as AxiosClient
  } else {
    const cookies = await getCookies()
    if (cookies?.AUTHP_SESSION_ID && cookies.access_token_dev) {
      SESSION_ID = cookies?.AUTHP_SESSION_ID
      ACCESS_TOKEN = cookies.access_token_dev
      return (client = axios.create({
        baseURL: CONFIG.BASE_URL,
        timeout: 10000,
        headers: {
          accept: 'application/json',
          'user-agent': 'VS Code Extension',
          cookie: `AUTHP_SESSION_ID=${SESSION_ID}; access_token_dev=${ACCESS_TOKEN}`,
        },
      })) as AxiosClient
    }
  }
}
export async function makeIQMRequest(endpoint = CONFIG.ENDPOINT) {
  try {
    const axiosClient = await getAxiosClient()
    const res = await axiosClient.get(endpoint)
    return { statusCode: res.status, data: res.data }
  } catch (error) {
    if (error.response) {
      return { statusCode: error.response.status, data: error.response.data }
    }
    throw error
  }
}

export async function getSwaggerDocs() {
  const result = await makeIQMRequest()
  if (result.statusCode !== 200) throw new Error('Failed to load docs')
  return result.data
}

export async function makeIQMApiCall(endpoint: string, options = {}) {
  try {
    const axiosClient = await getAxiosClient()
    const res = await axiosClient({ url: endpoint, ...options })
    return { statusCode: res.status, data: res.data, headers: res.headers }
  } catch (error) {
    if (error.response) {
      return { statusCode: error.response.status, data: error.response.data }
    }
    throw error
  }
}

export { CONFIG }
