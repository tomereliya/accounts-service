import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { GetClientsResponseDto } from './dto/get-clients.dto';

@Injectable()
export class ClientsService {
  async getClients(ids: string[]): Promise<GetClientsResponseDto> {
    try {
      const res = await axios.get<GetClientsResponseDto>(`${process.env.CLIENT_SERVICE_URL}/clients?ids=${ids.join(',')}`);
      
      if(res?.status === 200){
        return res.data;
      } else{
        Logger.error(`Error on getting clients with ids: ${ids.join(',')}`);
        throw new InternalServerErrorException(`Error on getting clients`);
      }
    } catch (err) {
      Logger.error(`Error on getting clients with ids: ${ids.join(',')}`, err);
      throw new InternalServerErrorException((err as Error).message);
    }
    
  }
}
