export interface WitsmlConnection {
    id: string
    url: string
    username: string
    password: string
    timeout: number
    proxyAddress: string
    proxyPort: number
    proxyUserName: any
    proxyPassword: any
    version: number
    acceptInvalidCertificate: boolean
    isAuthenticationBasic: boolean
    preAuthenticate: boolean
    jsonWebToken: any
    subProtocol: number
    applicationName: any
    applicationVersion: any
    etpWebSocket: number
  }
  