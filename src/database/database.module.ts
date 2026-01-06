import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Parse Supabase connection string
        const supabaseUrl = configService.get('supabase.url');
        const serviceKey = configService.get('supabase.serviceKey');
        console.log(supabaseUrl);

        return {
          type: 'postgres',
          url: configService.get('supabase.pooler'),
          entities: Object.values(entities),
          autoLoadEntities: true,
          synchronize: false,
          logging: configService.get('app.nodeEnv') === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}

// Alternative: Direct connection string approach
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import * as entities from './entities';

// @Module({
//   imports: [
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         type: 'postgres',
//         url: configService.get('supabase.connectionString'),
//         entities: Object.values(entities),
//         synchronize: false,
//         logging: configService.get('app.nodeEnv') === 'development',
//         ssl: {
//           rejectUnauthorized: false,
//         },
//       }),
//     }),
//   ],
// })
// export class DatabaseModule {}
