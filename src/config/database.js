import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('POS', 'root', 'reyyy', {
  host: 'localhost',
  dialect: 'mysql',
  timezone: '+07:00', // Waktu Jakarta (UTC+7)
});

export default sequelize;
