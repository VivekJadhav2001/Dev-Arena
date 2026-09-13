import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'
import type { ITheme } from '../utils/theme'

export interface IThemeList {
  themes: ITheme[]
  defaultThemeId: string
}

export const themeService = {
  async getThemes(): Promise<IThemeList> {
    const response = await apiRequest<IApiResponse<IThemeList>>('get', '/themes')
    return response.data
  },
}
