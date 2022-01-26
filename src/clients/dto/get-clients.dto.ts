export type GetClientResponseDto = {
    id: string;
    fullName: string;
    accountsNumbers: number[];
}

export type GetClientsResponseDto = GetClientResponseDto[];