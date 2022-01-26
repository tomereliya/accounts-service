import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './schemas/account.schema';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async createAccount(@Body() createAccountDto : CreateAccountDto): Promise<Account> {
    return this.accountsService.createAccount(createAccountDto);
  }

  @Get(':accountNumber')
  async getAccount(@Param('accountNumber') accountNumber: string): Promise<Account>{
      return this.accountsService.getAccount(accountNumber);
  }

  @Patch(':accountNumber/deposit')
  async deposit(@Param('accountNumber') accountNumber: string, @Body('amount') amount: number): Promise<void> {
    return this.accountsService.deposit(accountNumber, amount);
  }

  @Patch(':accountNumber/withdrawal')
  async withdrawal(@Param('accountNumber') accountNumber: string, @Body('amount') amount: number): Promise<void> {
    return this.accountsService.withdrawal(accountNumber, amount);
  }
}
