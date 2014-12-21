# clala

The language in which to perform a function in the AWS Lambda.

# usage

```sh
$ export CLALA_REGION=us-west-1
$ export CLALA_ROLE=arn:aws:iam::123456789012:role/lambda_exec_role
$ export CLALA_QUEUE_URL=https://sqs.ap-northeast-1.amazonaws.com/123456789012/myqueue

$ clala # show prompt
clala> ...

$ clala any-script.cll # run script
```

# example

```lisp
(define i 100)

(define func1 (clambda (x) (+ x i)))
(define func2 (clambda (y) (* y i)))

(func1 1 (lambda (x)
  (begin
    (print x)
    (func2 x (lambda (y)
      (begin
      (print y)
      (exit)))))))
```
