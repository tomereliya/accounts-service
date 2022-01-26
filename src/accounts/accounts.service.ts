import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientsService } from 'src/clients/clients.service';
import { GetClientsResponseDto } from 'src/clients/dto/get-clients.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account, AccountDocument, AccountType, MASTER_ACCOUNT_NUMBER } from './schemas/account.schema';
import retry from 'async-retry';

@Injectable()
export class AccountsService {
    constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>, private readonly clientsService: ClientsService){}
    async createAccount(createAccountDto : CreateAccountDto): Promise<Account> {
        let clients : GetClientsResponseDto;
        try{
            clients = await this.clientsService.getClients(createAccountDto.ownersIds);
        }catch(err){
            throw new InternalServerErrorException((err as Error).message);
        }

        if(!clients.length){
            throw new BadRequestException(`There are no clients with ids: ${createAccountDto.ownersIds.join(',')}`);
        }

        try {
            const createdAccount = new this.accountModel(createAccountDto);
            return await createdAccount.save();
        } catch (err) {
            Logger.error(`Error on creating account for ids: ${createAccountDto.ownersIds.join(',')}`, err);
            throw new InternalServerErrorException((err as Error).message);
        }

    }

    async getAccount(accountNumber: string | number): Promise<Account> {
        let account : Account;
        try{
            account = await this.accountModel.findOne({accountNumber});
        }catch(err){
            Logger.error(`Error on finding account #${accountNumber}`);
            throw new InternalServerErrorException((err as Error).message);
        }

        if(!account){
            throw new NotFoundException(`Cannot find account #${accountNumber}`);
        }
        return account;
    }

    async deposit(accountNumber: string, amount: number) : Promise<void> {
        if(amount < 0 ){
            throw new BadRequestException(`Cannot deposit negative amount of money`);
        }

        if(this.isMasterAccount(accountNumber)){
            throw new BadRequestException(`Cannot deposit to master account`);
        }

        try {
            const account = await this.getAccount(accountNumber);
            const newBalance = account.balance + amount;
            await this.accountModel.updateOne({accountNumber: account.accountNumber}, {$set: {balance: newBalance}});
        } catch (err) {
            Logger.error(`Error on deposit ${amount} to account #${accountNumber}`);
            if(err instanceof NotFoundException){
                throw err;
            } else{
                throw new InternalServerErrorException((err as Error).message);
            }
        }
    }

    async withdrawal(accountNumber: string, amount: number) : Promise<void> {

        if(amount < 0 ){
            throw new BadRequestException(`Cannot withdrawal negative amount of money`);
        }

        if(this.isMasterAccount(accountNumber)){
            throw new BadRequestException(`Cannot withdrawal from master account`);
        }

        try {
            await this.tryToWithdrawal(accountNumber, amount);
        } catch (err) {
            Logger.error(`Error on withdrawal ${amount} from account #${accountNumber}`);
            if(err instanceof NotFoundException){
                throw err;
            } else{
                throw new InternalServerErrorException((err as Error).message);
            }
        }
    }

    private isMasterAccount(account: Account | number | string): boolean{
        if(account instanceof Account){
            return account.accountType === AccountType.MASTER;
        } else {
           return account.toString() === MASTER_ACCOUNT_NUMBER.toString();
        }
    }

    private async tryToWithdrawal(accountNumberToWithdrawFrom: number | string, amount: number) : Promise<void> {
            const [account, masterAccount] = await Promise.all([this.getAccount(accountNumberToWithdrawFrom), this.getAccount(MASTER_ACCOUNT_NUMBER)]);

            try {
                await this.depositToMaster(masterAccount, amount);
            } catch (err) {
                throw new InternalServerErrorException(`Withdrawal process from account #${account.accountNumber} failed`);
            }

            try {
                await this.withdraw(account, amount);
            } catch (err) {
                this.handleWithdrawalFailure(account, amount);
                throw new InternalServerErrorException(`Withdrawal process from account #${account.accountNumber} failed`);
            }

        }

        private async depositToMaster(masterAccount: Account, amount: number): Promise<void>{
            try {
                await retry(
                    async () => {
                        await this.accountModel.updateOne({accountNumber: MASTER_ACCOUNT_NUMBER}, {$set: {balance: (masterAccount.balance + amount)}});
                        return;
                    },
                    {
                        retries: 3,
                        factor: 2
                    }
                )
            } catch (err) {
                Logger.error(`Failed to deposit to master account`,err);
                throw new InternalServerErrorException();
            }
        }

        private async withdraw(account: Account, amount: number): Promise<void>{

            try {
                await retry(
                    async () => {
                        await this.accountModel.updateOne({accountNumber: account.accountNumber}, {$set: {balance: (account.balance - amount)}});
                        return;
                    },
                    {
                        retries: 3,
                        factor: 2
                    }
                )
            } catch (err) {
                Logger.error(`Failed to withdraw from account #${account.accountNumber}`,err);
                throw new InternalServerErrorException();
            }
        }

        private async handleWithdrawalFailure(account: Account, amount: number): Promise<void>{
            // Here we can implement failure mechanism
            // Like pushing a msg to queue failure
        }
}
