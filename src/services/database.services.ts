import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '../models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.Schema'
import { Follower } from '~/models/schemas/Follow.Schema'
import Tweet from '~/models/schemas/Tweet.Schema'
config() // là để đọc file .env

//chúng ta cần mã hóa password với username của database
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f3.mgxao1u.mongodb.net/?retryWrites=true&w=majority`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri)
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 }) //nếu thành công thì sẽ trả về 1
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error) //thông báo lỗi
      throw error //throw error để quăng lỗi vê 1 chỗ xử lý lỗi cuối cùng
    }
  }

  get users(): Collection<User> {
    // định dạng object được lấy ra là users, cái này ngon nha
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  async indexUsers() {
    const isExisted = await this.users.indexExists(['username_1', 'email_1_password_1'])
    if (isExisted) return
    await this.users.createIndex({ email: 1 }, { unique: true }) //register
    await this.users.createIndex({ username: 1 }, { unique: true }) //getProfile
    await this.users.createIndex({ email: 1, password: 1 }) //login
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  async indexRefreshTokens() {
    const isExisted = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (isExisted) return
    await this.refreshTokens.createIndex({ token: 1 }) //bản chất là ko cần await vì khi nào chúng ta cần hứng kết quả thì mới nên await
    await this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }

  async indexFollowers() {
    const isExisted = await this.followers.indexExists(['user_id_1_f ollowed_user_id_1'])
    if (isExisted) return
    await this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }
}

//ko nên export class vì mỗi lần import vô phải tạo object từ class mới xài đc
//thay vì như trên chúng ta tạo object rồi export luôn để mỗi lần gọi phải khởi tạo object
const databaseService = new DatabaseService()
export default databaseService
