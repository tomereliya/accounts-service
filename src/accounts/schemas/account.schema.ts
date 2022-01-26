import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

export enum AccountType {
  PRIVATE = 'PRIVATE',
  BUSINESS = "BUSINESS",
  MASTER = "MASTER"
}

export const MASTER_ACCOUNT_NUMBER = 1;

@Schema()
export class Account {
  @Prop({required: true, unique: true})
  accountNumber: number;
  
  @Prop({required: true})
  balance: number;

  @Prop({required: true})
  ownersIds: string[]

  @Prop({required: true, enum: AccountType, validate: {
    validator: (accountType: AccountType) => accountType !== AccountType.MASTER,
    message: `Cannot add master account`
  } })
  accountType: AccountType
}

export const AccountSchema = SchemaFactory.createForClass(Account);