from livekit import agents
from livekit.plugins import openai
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb
import pypdf

print("All dependencies loaded successfully!")