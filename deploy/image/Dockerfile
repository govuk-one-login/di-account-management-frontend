FROM alpine:latest

RUN apk update && apk add python3 py3-pip
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY app.py ./
ENV FLASK_APP=app
ENTRYPOINT [ "python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=6001"]