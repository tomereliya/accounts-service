import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({envFilePath: `./env/${process.env.NODE_ENV}.env`}), MongooseModule.forRoot(`mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER_NAME}.pbl3x.mongodb.net/accounts?retryWrites=true&w=majority`), AccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
