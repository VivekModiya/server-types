import { chromium } from 'playwright'
import vscode from 'vscode'

export async function getCookies(): Promise<{
  AUTHP_SESSION_ID: string | null
  access_token_dev: string | null
} | null> {
  try {
    vscode.window.showInformationMessage(
      'Starting cookie extraction process...'
    )

    const browser = await chromium.launch({ headless: true })
    vscode.window.showInformationMessage('Browser launched successfully')

    const page = await browser.newPage()
    vscode.window.showInformationMessage('New page created')

    // Navigate to the URL
    vscode.window.showInformationMessage(
      'Navigating to https://docs.stage.iqm.services'
    )
    await page.goto('https://docs.stage.iqm.services')
    vscode.window.showInformationMessage('Page loaded successfully')

    // Wait for network idle
    vscode.window.showInformationMessage(
      'Waiting for network to become idle...'
    )
    await page.waitForLoadState('networkidle')
    vscode.window.showInformationMessage('Network is now idle')

    // Click on available anchor tag (assuming first available one)
    vscode.window.showInformationMessage('Looking for available anchor tag...')
    await page.click('a')
    vscode.window.showInformationMessage('Clicked on anchor tag')

    // Wait for network idle
    vscode.window.showInformationMessage(
      'Waiting for network to become idle after anchor click...'
    )
    await page.waitForLoadState('networkidle')
    vscode.window.showInformationMessage('Network is idle after anchor click')

    // Click on account with email starting with vivek.m
    vscode.window.showInformationMessage(
      'Looking for account with email starting with vivek.m...'
    )

    page.screenshot({ path: './accounts.png' })
    await page.click('text=/vivek\\.m/')
    vscode.window.showInformationMessage('Clicked on vivek.m account')

    // Wait for network idle
    vscode.window.showInformationMessage(
      'Waiting for network to become idle after account selection...'
    )
    await page.waitForLoadState('networkidle')
    vscode.window.showInformationMessage(
      'Network is idle after account selection'
    )

    // Get the required cookies
    vscode.window.showInformationMessage('Extracting cookies...')
    const cookies = await page.context().cookies()
    const authSession = cookies.find(c => c.name === 'AUTHP_SESSION_ID')
    const accessToken = cookies.find(c => c.name === 'access_token_dev')

    const result = {
      AUTHP_SESSION_ID: authSession?.value || null,
      access_token_dev: accessToken?.value || null,
    }

    vscode.window.showInformationMessage(
      `Cookies extracted successfully: AUTHP_SESSION_ID=${
        authSession ? 'found' : 'not found'
      }, access_token_dev=${accessToken ? 'found' : 'not found'}`
    )

    return result
  } catch (error) {
    vscode.window.showErrorMessage(`Error fetching cookies: ${error}`)
    return null
  } finally {
    vscode.window.showInformationMessage('Closing browser...')
    await vscode.window.showInformationMessage('Browser closed successfully')
  }
}
