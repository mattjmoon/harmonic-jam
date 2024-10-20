import axios from 'axios';

export interface ICompany {
    id: number;
    company_name: string;
    liked: boolean;
}

export interface ICollection {
    id: string;
    collection_name: string;
}

export interface ICompanyBatchResponse {
    companies: ICompany[];
    total: number;
}

export interface ICollectionResponse extends ICollection {
    companies: ICompany[];
    total: number;
}

const BASE_URL = 'http://localhost:8000';

export async function getCompanies(offset?: number, limit?: number): Promise<ICompanyBatchResponse> {
    try {
        const response = await axios.get(`${BASE_URL}/companies`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function toggleCompanyLike(companyId: number): Promise<ICompany> {
    try {
      const response = await axios.post(`${BASE_URL}/companies/${companyId}/toggle-like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling company like:', error);
      throw error;
    }
  }

export async function getCollectionsById(id: string, offset?: number, limit?: number): Promise<ICollection> {
    try {
        const response = await axios.get(`${BASE_URL}/collections/${id}`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching collection:', error);
        throw error;
    }
}

export async function getCollectionsMetadata(): Promise<ICollection[]> {
    try {
        const response = await axios.get(`${BASE_URL}/collections`);
        return response.data;
    } catch (error) {
        console.error('Error fetching collections metadata:', error);
        throw error;
    }
}

export async function addCompaniesToLiked(companyIds: number[]): Promise<ICompany[]> {
    try {
        const response = await axios.post(`${BASE_URL}/companies/add-to-liked`, { ids: companyIds });
        return response.data;
    } catch (error) {
        console.error('Error adding companies to liked:', error);
        throw error;
    }
}

export async function removeCompaniesFromLiked(companyIds: number[]): Promise<ICompany[]> {
    try {
        const response = await axios.post(`${BASE_URL}/companies/remove-from-liked`, { ids: companyIds });
        return response.data;
    } catch (error) {
        console.error('Error removing companies from liked:', error);
        throw error;
    }
}