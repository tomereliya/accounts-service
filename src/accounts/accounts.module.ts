import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsService } from 'src/clients/clients.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account, AccountSchema } from './schemas/account.schema';


@Module({
  imports: [MongooseModule.forFeature([{name: Account.name, schema: AccountSchema}])],
  controllers: [AccountsController],
  providers: [AccountsService, ClientsService],
})
export class AccountsModule {}
