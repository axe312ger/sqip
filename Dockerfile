FROM circleci/node:8
RUN sudo wget https://dl.google.com/go/go1.12.linux-amd64.tar.gz
RUN sudo tar -xvf go1.12.linux-amd64.tar.gz
RUN sudo mv go /usr/local
ENV GOROOT=/usr/local/go
ENV PATH=$GOROOT/bin:$PATH
RUN go version
RUN node -v